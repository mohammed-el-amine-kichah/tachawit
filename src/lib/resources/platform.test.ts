import { describe, expect, it } from "vitest";
import { isPlatformUrl, platformOfUrl } from "./platform";

describe("platformOfUrl", () => {
  it("recognises each platform, including short and mobile hosts", () => {
    expect(platformOfUrl("https://www.youtube.com/watch?v=abc")).toBe("youtube");
    expect(platformOfUrl("https://youtu.be/abc")).toBe("youtube");
    expect(platformOfUrl("https://m.youtube.com/@channel")).toBe("youtube");
    expect(platformOfUrl("https://www.tiktok.com/@user/video/1")).toBe("tiktok");
    expect(platformOfUrl("https://vm.tiktok.com/ZMabc/")).toBe("tiktok");
    expect(platformOfUrl("https://www.facebook.com/groups/chaoui")).toBe("facebook");
    expect(platformOfUrl("https://fb.watch/abc/")).toBe("facebook");
    expect(platformOfUrl("https://m.facebook.com/page")).toBe("facebook");
    expect(platformOfUrl("https://www.instagram.com/p/abc/")).toBe("instagram");
  });

  it("ignores letter case in the host", () => {
    expect(platformOfUrl("https://WWW.YouTube.com/@channel")).toBe("youtube");
  });

  it("rejects anything that is not an https link to a known platform", () => {
    expect(platformOfUrl("http://www.youtube.com/watch?v=abc")).toBeNull();
    expect(platformOfUrl("javascript:alert(1)")).toBeNull();
    expect(platformOfUrl("https://youtube.com.evil.example/watch")).toBeNull();
    expect(platformOfUrl("https://notyoutube.com/watch")).toBeNull();
    expect(platformOfUrl("https://example.com/?u=https://youtube.com")).toBeNull();
    expect(platformOfUrl("https://user@evil.example/youtube.com")).toBeNull();
    expect(platformOfUrl("not a link")).toBeNull();
    expect(platformOfUrl("")).toBeNull();
  });
});

describe("isPlatformUrl", () => {
  it("needs the link to belong to the chosen platform", () => {
    expect(isPlatformUrl("youtube", "https://youtu.be/abc")).toBe(true);
    expect(isPlatformUrl("instagram", "https://youtu.be/abc")).toBe(false);
  });
});
