package main

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
	"os"
	"strconv"

	internalMovie "case-studies/grpc/internal/movie"
	"case-studies/grpc/internal/observability"
	"case-studies/grpc/internal/validation"
)

const (
	AppType = "rest-server"
	AppName = "movie"
)

func loadMovies(path string) ([]internalMovie.Movie, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	var movies []internalMovie.Movie
	if err := json.NewDecoder(file).Decode(&movies); err != nil {
		return nil, err
	}
	return movies, nil
}

func moviesHandler(w http.ResponseWriter, r *http.Request) {
	minRatingStr := r.URL.Query().Get("min_rating")
	minRating := float32(0.0)
	if minRatingStr != "" {
		val, err := strconv.ParseFloat(minRatingStr, 32)
		if err != nil {
			http.Error(w, "Invalid min_rating", http.StatusBadRequest)
			return
		}
		minRating = float32(val)
		if err := validation.ValidateMovieRatings(minRating); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	}
	movies, err := loadMovies("./assets/movie-data.json")
	if err != nil {
		http.Error(w, "Failed to load movies", http.StatusInternalServerError)
		return
	}
	filtered := make([]internalMovie.Movie, 0)
	for _, m := range movies {
		if m.RatingsScore > minRating {
			filtered = append(filtered, m)
		}
	}
	resp := internalMovie.MovieResponse{Movies: filtered, MovieCount: len(filtered)}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func main() {
	serverCert := flag.String("server_cert", "", "Path to server certificate")
	serverKey := flag.String("server_key", "", "Path to server private key")
	caCert := flag.String("ca_cert", "", "Path to client CA certificate (for mTLS)")
	addr := flag.String("addr", ":8080", "Address to listen on")
	flag.Parse()

	observability.SetupLogger("info")
	observability.LogStartup(AppType, AppName, map[string]interface{}{
		"address": *addr,
	})

	if *serverCert == "" || *serverKey == "" {
		observability.LogError("config-validation", "main", fmt.Errorf("server_cert and server_key are required for mTLS"), nil)
		os.Exit(1)
	}

	var tlsConfig *tls.Config
	if *caCert != "" {
		caCertData, err := os.ReadFile(*caCert)
		if err != nil {
			observability.LogError("ca-cert-read", "main", err, map[string]interface{}{
				"ca_cert": *caCert,
			})
			os.Exit(1)
		}
		caPool := x509.NewCertPool()
		if !caPool.AppendCertsFromPEM(caCertData) {
			observability.LogError("ca-cert-append", "main", fmt.Errorf("failed to append client CA certificate"), nil)
			os.Exit(1)
		}
		tlsConfig = &tls.Config{
			ClientAuth: tls.RequireAndVerifyClientCert,
			ClientCAs:  caPool,
		}
	} else {
		tlsConfig = &tls.Config{}
	}

	http.HandleFunc("/movies", moviesHandler)
	server := &http.Server{
		Addr:      *addr,
		TLSConfig: tlsConfig,
	}

	observability.LogSuccess("server-listen", "main", map[string]interface{}{
		"address": *addr,
	})

	if err := server.ListenAndServeTLS(*serverCert, *serverKey); err != nil {
		observability.LogError("server-serve", "main", err, nil)
		os.Exit(1)
	}
}
