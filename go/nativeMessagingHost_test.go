package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestIsFileGateway(t *testing.T) {
	cases := []struct {
		name     string
		status   int
		location string
		want     bool
	}{
		{"permanent redirect", http.StatusMovedPermanently, "/file/", true},
		{"found redirect", http.StatusFound, "/file/", true},
		{"temporary redirect", http.StatusTemporaryRedirect, "/file/", true},
		{"permanent method-preserving redirect", http.StatusPermanentRedirect, "/file/", true},
		{"unrelated redirect", http.StatusTemporaryRedirect, "/login", false},
		{"unrelated permanent redirect", http.StatusMovedPermanently, "/login", false},
		{"missing location", http.StatusTemporaryRedirect, "", false},
		{"not modified", http.StatusNotModified, "/file/", false},
		{"ordinary response", http.StatusOK, "/file/", false},
		{"not found", http.StatusNotFound, "", false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Method != http.MethodGet || r.URL.Path != "/file" {
					t.Errorf("unexpected request (redirect must not be followed): %s %s", r.Method, r.URL.Path)
				}
				if tc.location != "" {
					w.Header().Set("Location", tc.location)
				}
				w.WriteHeader(tc.status)
			}))
			defer server.Close()

			port := strings.TrimPrefix(server.URL, "http://127.0.0.1:")
			got, err := isFileGateway(port)
			if err != nil {
				t.Fatal(err)
			}
			if got != tc.want {
				t.Errorf("isFileGateway() = %v, want %v", got, tc.want)
			}
		})
	}
}
