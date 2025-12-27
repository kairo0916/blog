import type {
	ExpressiveCodeConfig,
	GitHubEditConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
	umamiConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "Kairo's Blog",
	subtitle: ":3",
	lang: "zh_TW",
	themeColor: {
		hue: 361,
		fixed: true,
  forceDarkMode: true,
	},
	banner: {
		enable: true,
		src: "assets/images/banner.png",
		position: "center",
		credit: {
			enable: false,
			text: "",
			url: "",
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// Leave this array empty to use the default favicon
		{
		  src: '/assets/images/icon.jpg',    // Path of the favicon, relative to the /public directory
		//  theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
		//  sizes: '720x720',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
		}
	],
	officialSites: [
		{ url: "https://kairo.qzz.io", alias: "Home" },
	]
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		{
			name: "統計",
			url: "https://cloud.umami.is/share/a1g8yIo7d1beMXkf",
			external: true,
		},
		{
			name: "GitHub",
			url: "https://github.com/kairo0916", // Internal links should not include the base path, as it is automatically added
			external: true, // Show an external link icon and will open in a new tab
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar.jpg",
	name: "Kairo",
	bio: "I'm Kairo",
	links: [
  {
   name: "Discord",
   icon: "fa6-brands:discord",
   url: "https://discord.com/users/1433736270311587910",
  },
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/kairo0916",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const umamiConfig: UmamiConfig = {
	enable: true,
	baseUrl: "https://cloud.umami.is/analytics/us/share/",
	shareId: "a1g8yIo7d1beMXkf",
	timezone: "Asia/Taipei",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};

export const gitHubEditConfig: GitHubEditConfig = {
	enable: true,
	baseUrl: "https://github.com/kairo0916/blog/main/src/content/posts",
};
