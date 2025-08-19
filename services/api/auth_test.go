package main

import (
    "testing"
    "time"
)

// Test JWT creation and parsing
func TestJWT(t *testing.T) {
    secret := []byte("testsecret")
    sub := "1234"
    token, err := createJWT(sub, secret, time.Now().Add(time.Minute))
    if err != nil {
        t.Fatalf("failed to create jwt: %v", err)
    }
    parsed, err := parseJWT(token, secret)
    if err != nil {
        t.Fatalf("failed to parse jwt: %v", err)
    }
    if parsed != sub {
        t.Fatalf("expected subject %s got %s", sub, parsed)
    }
}
