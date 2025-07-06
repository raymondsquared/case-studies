package main

import (
	"log/slog"
	"os"
	"path/filepath"
)

type MoviesFileReader struct {
	file *os.File
}

func (r *MoviesFileReader) Read(p []byte) (n int, err error) {
	return r.file.Read(p)
}

func (r *MoviesFileReader) Close() error {
	return r.file.Close()
}

func NewMoviesFileReader(filePath string, logger *slog.Logger) (*MoviesFileReader, error) {
	cwd, err := os.Getwd()
	if err != nil {
		logger.Error("MoviesFileReader: failed to get working directory", "function", "NewMoviesFileReader", "error", err)
		return nil, err
	}

	jsonPath := filepath.Join(cwd, filepath.Join(filePath, "movie-data.json"))
	file, err := os.Open(jsonPath)
	if err != nil {
		logger.Error("MoviesFileReader: failed to open movies file", "function", "NewMoviesFileReader", "error", err)
		return nil, err
	}
	return &MoviesFileReader{file: file}, nil
}
