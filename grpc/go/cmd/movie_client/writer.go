package main

import (
	"fmt"
	"io"
	"os"

	"google.golang.org/protobuf/proto"

	"case-studies/grpc/cmd/movie"
)

type MovieFileWriter struct {
	file *os.File
}

func NewMovieFileWriter(path string) (*MovieFileWriter, error) {
	f, err := os.Create(path)
	if err != nil {
		return nil, err
	}
	return &MovieFileWriter{file: f}, nil
}

func (w *MovieFileWriter) Write(p []byte) (n int, err error) {
	return w.file.Write(p)
}

func (w *MovieFileWriter) Close() error {
	return w.file.Close()
}

func WriteMovieResponse(w io.Writer, response *movie.GetMovieOutput) error {
	data, err := proto.Marshal(response)
	if err != nil {
		return fmt.Errorf("could not marshal response: %w", err)
	}
	_, err = w.Write(data)
	if err != nil {
		return fmt.Errorf("could not write response to writer: %w", err)
	}
	return nil
}
