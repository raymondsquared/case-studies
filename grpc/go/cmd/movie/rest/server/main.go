package main

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"os"
	"strconv"

	internalMovie "case-studies/grpc/internal/movie"
	"case-studies/grpc/internal/validation"
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
	movies, err := loadMovies("../assets/movie-data.json")
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

	if *serverCert == "" || *serverKey == "" {
		log.Fatal("server_cert and server_key are required for mTLS")
	}

	var tlsConfig *tls.Config
	if *caCert != "" {
		caCert, err := os.ReadFile(*caCert)
		if err != nil {
			log.Fatalf("Failed to read client CA certificate: %v", err)
		}
		caPool := x509.NewCertPool()
		if !caPool.AppendCertsFromPEM(caCert) {
			log.Fatal("Failed to append client CA certificate")
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
	log.Printf("REST Movie server (mTLS) listening on %s", *addr)
	log.Fatal(server.ListenAndServeTLS(*serverCert, *serverKey))
}
