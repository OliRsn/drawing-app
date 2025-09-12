export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Tirage au sort",
  description: "Application de tirage au sort pour classe.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Tirage", 
      href: "/drawer",
    },
    {
      label: "Admin",
      href: "/admin",
    },
    {
      label: "A Propos",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "Drawer",  
      href: "/drawer",
    },
  ],
  links: {
  },
};
