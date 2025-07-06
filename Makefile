.PHONY: tag

tag:
	@if [ -z "$(word 2,$(MAKECMDGOALS))" ]; then \
		echo "Usage: make tag <tagname>"; \
		exit 1; \
	fi; \
	./scripts/tag.sh $(word 2,$(MAKECMDGOALS))

# Allow 'make tag x.y.z' syntax
%:
	@:
