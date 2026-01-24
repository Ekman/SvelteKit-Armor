import {urlConcat} from "./utils";

describe("utils", () => {
	it("should be able to concat URL with path", () => {
		expect(urlConcat("https://foo.example/", "bar")).toBe("https://foo.example/bar");
	})
})
