package main

import (
	"case-studies/grpc/internal/observability"
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

func NewMoviesFileReader(filePath string) (*MoviesFileReader, error) {
	cwd, err := os.Getwd()
	if err != nil {
		observability.LogError("working-directory", "NewMoviesFileReader", err, nil)
		return nil, err
	}

	jsonPath := filepath.Join(cwd, filepath.Join(filePath, "movie-data.json"))
	file, err := os.Open(jsonPath)
	if err != nil {
		observability.LogError("file-open", "NewMoviesFileReader", err, map[string]interface{}{
			"file_path": jsonPath,
		})
		return nil, err
	}
	return &MoviesFileReader{file: file}, nil
}
