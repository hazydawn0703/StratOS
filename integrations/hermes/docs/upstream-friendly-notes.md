# Upstream-friendly Notes

To keep Hermes upstream integration lightweight:

- define bridge hooks as optional extension points
- avoid adding StratOS-specific objects to Hermes core domain model
- keep bridge failures non-fatal to normal Hermes task execution
- gate all bridge features by configuration flags
