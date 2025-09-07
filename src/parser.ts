import { type } from "arktype";

const MarionetteProcessConfig = type({
	command: "string",
});

const MarionetteConfig = type({
	name: "string",
	"[string]": MarionetteProcessConfig,
});
