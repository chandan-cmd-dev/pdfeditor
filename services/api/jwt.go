package main

import (
    "errors"
    "time"

    "github.com/golang-jwt/jwt/v5"
)

// createJWT creates a JWT token string with the given subject and expiry.  The
// secret is used to sign the token using HS256.  Additional claims could be
// added as needed (e.g. roles, scopes).
func createJWT(sub string, secret []byte, expiresAt time.Time) (string, error) {
    claims := jwt.MapClaims{
        "sub": sub,
        "exp": expiresAt.Unix(),
        "iat": time.Now().Unix(),
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(secret)
}

// parseJWT verifies a token string and returns the subject (user ID) if valid.
func parseJWT(tokenStr string, secret []byte) (string, error) {
    token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("unexpected signing method")
        }
        return secret, nil
    })
    if err != nil {
        return "", err
    }
    if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
        if sub, ok := claims["sub"].(string); ok {
            return sub, nil
        }
    }
    return "", errors.New("invalid token")
}
