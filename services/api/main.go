package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	minio "github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// User model represents an account in the system.
type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string    `json:"-"`
	Role         string    `gorm:"default:user" json:"role"` // user or admin
	Plan         string    `gorm:"default:free" json:"plan"`
	CreatedAt    time.Time `json:"created_at"`
}

// File model stores metadata about uploaded PDFs.
// The actual file is stored on local disk (demo) and referenced by StorageKey.
type File struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	OwnerID    uuid.UUID `gorm:"type:uuid;not null" json:"owner_id"`
	Owner      User      `gorm:"foreignKey:OwnerID" json:"-"`
	Name       string    `json:"name"`
	Size       int64     `json:"size"`
	StorageKey string    `json:"storage_key"`
	CreatedAt  time.Time `json:"created_at"`
}

// App holds shared dependencies such as the DB and configuration.
type App struct {
	DB         *gorm.DB
	JwtSecret  []byte
	StorageDir string
	S3Client   *minio.Client
	S3Bucket   string
}

func main() {
	// --- Configuration -------------------------------------------------------
	dsn := os.Getenv("API_POSTGRES_DSN")
	if dsn == "" {
		// Default to docker-compose service name.
		dsn = "postgres://postgres:postgres@db:5432/pdfeditor?sslmode=disable"
	}
	jwtSecret := os.Getenv("API_JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "change-me"
	}
	storageDir := os.Getenv("API_UPLOADS_DIR")
	if storageDir == "" {
		storageDir = "/uploads" // matches docker volume in compose
	}
	_ = os.MkdirAll(storageDir, 0755)

	s3Endpoint := os.Getenv("API_S3_ENDPOINT")
	s3Access := os.Getenv("API_S3_ACCESS_KEY")
	s3Secret := os.Getenv("API_S3_SECRET_KEY")
	s3Bucket := os.Getenv("API_S3_BUCKET")
	var s3Client *minio.Client
	if s3Endpoint != "" && s3Access != "" && s3Secret != "" && s3Bucket != "" {
		useSSL := strings.HasPrefix(s3Endpoint, "https://")
		endpoint := strings.TrimPrefix(strings.TrimPrefix(s3Endpoint, "https://"), "http://")
		s3Client, err = minio.New(endpoint, &minio.Options{
			Creds:  credentials.NewStaticV4(s3Access, s3Secret, ""),
			Secure: useSSL,
		})
		if err != nil {
			log.Fatalf("failed to init s3 client: %v", err)
		}
	} else {
		log.Printf("S3 credentials not provided; using local storage at %s", storageDir)
	}

	// --- DB connect (with simple retry) --------------------------------------
	var db *gorm.DB
	var err error
	for i := 0; i < 30; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			break
		}
		log.Printf("DB not ready, retrying in 1s: %v", err)
		time.Sleep(1 * time.Second)
	}
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	// Migrations
	if err := db.AutoMigrate(&User{}, &File{}); err != nil {
		log.Fatalf("failed to migrate: %v", err)
	}

	app := &App{
		DB:         db,
		JwtSecret:  []byte(jwtSecret),
		StorageDir: storageDir,
		S3Client:   s3Client,
		S3Bucket:   s3Bucket,
	}

	// --- HTTP server ---------------------------------------------------------
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	// If you use Next.js rewrite (/api → API), CORS isn't needed; keep conservative CORS for direct calls.
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Auth routes
	r.POST("/auth/signup", app.handleSignup)
	r.POST("/auth/login", app.handleLogin)
	r.POST("/auth/logout", app.handleLogout)

	// Authenticated routes
	auth := r.Group("")
	auth.Use(app.AuthMiddleware)
	auth.GET("/me", app.handleMe)
	auth.GET("/files", app.handleListFiles)
	auth.POST("/files", app.handleCreateFile)
	auth.GET("/files/:id", app.handleGetFile)
	auth.GET("/files/:id/content", app.handleFileContent) // ✅ stream the PDF by id
	auth.DELETE("/files/:id", app.handleDeleteFile)
	auth.POST("/billing/subscribe", app.handleBillingSubscribe)

	// Public upload/download (demo only; in production use presigned S3)
	r.PUT("/upload/:key", app.handleUpload)
	r.GET("/download/:key", app.handleDownload)

	port := os.Getenv("API_PORT")
	if port == "" {
		port = "8080"
	}
	host := os.Getenv("API_HOST")
	if host == "" {
		host = "0.0.0.0"
	}
	log.Printf("API listening on %s:%s", host, port)
	if err := r.Run(host + ":" + port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

// --- Handlers ---------------------------------------------------------------

// handleSignup registers a new user (demo: immediate create).
func (a *App) handleSignup(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var existing User
	if result := a.DB.Where("email = ?", strings.ToLower(req.Email)).First(&existing); result.Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email already registered"})
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to create user"})
		return
	}
	user := User{
		ID:           uuid.New(),
		Email:        strings.ToLower(req.Email),
		PasswordHash: string(hash),
		Role:         "user",
		Plan:         "free",
		CreatedAt:    time.Now(),
	}
	if err := a.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "user created"})
}

// handleLogin authenticates a user and sets a JWT cookie.
func (a *App) handleLogin(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var user User
	if err := a.DB.Where("email = ?", strings.ToLower(req.Email)).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	token, err := createJWT(user.ID.String(), a.JwtSecret, time.Now().Add(24*time.Hour))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create token"})
		return
	}
	c.SetCookie("token", token, 3600*24, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "logged in"})
}

// handleLogout clears the auth cookie.
func (a *App) handleLogout(c *gin.Context) {
	c.SetCookie("token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// handleMe returns the current user.
func (a *App) handleMe(c *gin.Context) {
	user := c.MustGet("user").(User)
	c.JSON(http.StatusOK, user)
}

// handleListFiles returns files belonging to the current user.
func (a *App) handleListFiles(c *gin.Context) {
	user := c.MustGet("user").(User)
	var files []File
	if err := a.DB.Where("owner_id = ?", user.ID).Find(&files).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, files)
}

// handleCreateFile creates metadata and returns a browser-usable upload URL.
func (a *App) handleCreateFile(c *gin.Context) {
	user := c.MustGet("user").(User)
	var req struct {
		Name string `json:"name" binding:"required"`
		Size int64  `json:"size" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	id := uuid.New()
	storageKey := id.String() + ".pdf"
	file := File{
		ID:         id,
		OwnerID:    user.ID,
		Name:       req.Name,
		Size:       req.Size,
		StorageKey: storageKey,
		CreatedAt:  time.Now(),
	}
	if err := a.DB.Create(&file).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return a URL the browser can call via Next proxy.
	uploadURL := "/api/upload/" + storageKey

	c.JSON(http.StatusCreated, gin.H{
		"fileId":      file.ID,
		"uploadUrl":   uploadURL,       // e.g. /api/upload/<key>
		"storage_key": file.StorageKey, // client may also use /api/download/<key>
	})
}

// handleGetFile returns file metadata (+ a download URL for convenience).
func (a *App) handleGetFile(c *gin.Context) {
	user := c.MustGet("user").(User)
	id := c.Param("id")
	var file File
	if err := a.DB.Preload("Owner").First(&file, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}
	if file.OwnerID != user.ID && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	downloadURL := "/api/download/" + file.StorageKey
	c.JSON(http.StatusOK, gin.H{
		"id":          file.ID,
		"name":        file.Name,
		"size":        file.Size,
		"created_at":  file.CreatedAt,
		"storage_key": file.StorageKey,
		"downloadUrl": downloadURL,
	})
}

// handleFileContent streams the binary PDF by file ID (auth required).
func (a *App) handleFileContent(c *gin.Context) {
	user := c.MustGet("user").(User)
	fileID := c.Param("id")

	var f File
	if err := a.DB.First(&f, "id = ? AND owner_id = ?", fileID, user.ID).Error; err != nil {
		c.String(http.StatusNotFound, "not found")
		return
	}
	if f.StorageKey == "" {
		c.String(http.StatusNotFound, "no storage key")
		return
	}

	root := a.StorageDir
	path := filepath.Clean(filepath.Join(root, f.StorageKey))

	// Path traversal guard
	if !strings.HasPrefix(path, filepath.Clean(root)+string(os.PathSeparator)) {
		c.String(http.StatusBadRequest, "invalid storage key")
		return
	}

	stat, err := os.Stat(path)
	if err != nil || stat.IsDir() {
		c.String(http.StatusNotFound, "content not found")
		return
	}

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Length", fmt.Sprintf("%d", stat.Size()))
	c.File(path)
}

// handleDeleteFile deletes metadata and local file (if exists).
func (a *App) handleDeleteFile(c *gin.Context) {
	user := c.MustGet("user").(User)
	id := c.Param("id")
	var file File
	if err := a.DB.First(&file, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}
	if file.OwnerID != user.ID && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	_ = os.Remove(filepath.Join(a.StorageDir, file.StorageKey))
	if err := a.DB.Delete(&file).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// handleBillingSubscribe returns a dummy URL (stub for Stripe).
func (a *App) handleBillingSubscribe(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"checkoutUrl": "https://example.com/checkout"})
}

// AuthMiddleware authenticates via JWT cookie and injects the user in context.
func (a *App) AuthMiddleware(c *gin.Context) {
	token, err := c.Cookie("token")
	if err != nil || token == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
		return
	}
	userID, err := parseJWT(token, a.JwtSecret)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}
	var user User
	if err := a.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	c.Set("user", user)
	c.Next()
}

// handleUpload writes the request body into a file in the storage directory.
func (a *App) handleUpload(c *gin.Context) {
	key := c.Param("key")
	if a.S3Client != nil {
		if _, err := a.S3Client.PutObject(c.Request.Context(), a.S3Bucket, key, c.Request.Body, -1, minio.PutObjectOptions{}); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Status(http.StatusNoContent)
		return
	}
	full := filepath.Join(a.StorageDir, key)
	if err := os.MkdirAll(filepath.Dir(full), 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	f, err := os.Create(full)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer f.Close()
	if _, err := io.Copy(f, c.Request.Body); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// handleDownload streams a file back to the client (public demo endpoint).
func (a *App) handleDownload(c *gin.Context) {
	key := c.Param("key")
	if a.S3Client != nil {
		obj, err := a.S3Client.GetObject(c.Request.Context(), a.S3Bucket, key, minio.GetObjectOptions{})
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
			return
		}
		defer obj.Close()
		stat, err := obj.Stat()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Length", fmt.Sprintf("%d", stat.Size))
		http.ServeContent(c.Writer, c.Request, key, stat.LastModified, obj)
		return
	}
	full := filepath.Join(a.StorageDir, key)
	f, err := os.Open(full)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}
	defer f.Close()
	fi, _ := f.Stat()
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Length", fmt.Sprintf("%d", fi.Size()))
	http.ServeContent(c.Writer, c.Request, key, fi.ModTime(), f)
}
