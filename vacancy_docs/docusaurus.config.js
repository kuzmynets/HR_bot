import { themes as prismThemes } from "prism-react-renderer";

export default {
    title: "Підбір вакансій — Документація",
    tagline: "Експертна система для підбору вакансій",
    url: "https://your-site.com",
    baseUrl: "/",
    organizationName: "mdidyk",
    projectName: "vacancy-docs",
    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",
    i18n: {
        defaultLocale: "uk",
        locales: ["uk"],
    },
    presets: [
        [
            "classic",
            {
                docs: {
                    sidebarPath: require.resolve("./sidebars.js"),
                    routeBasePath: "/",
                },
                theme: {
                    customCss: require.resolve("./src/css/custom.css"),
                },
            },
        ],
    ],
    themeConfig: {
        navbar: {
            title: "Підбір вакансій",
            items: [
                { href: "https://github.com", label: "GitHub", position: "right" },
            ],
        },
        footer: {
            style: "dark",
            links: [
                {
                    title: "Документація",
                    items: [
                        { label: "Про систему", to: "/system/overview" },
                        { label: "Для користувача", to: "/user/usage" },
                        { label: "Для адміністратора", to: "/admin/panel" },
                    ],
                },
            ],
            copyright: `© ${new Date().getFullYear()} Експертна система "Підбір вакансій".`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
    },
};
