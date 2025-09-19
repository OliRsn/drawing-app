export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Tirage au sort",
  description: "Application de tirage au sort pour classe.",
  navItems: [
    {
      label: "Tirage", 
      href: "/",
    },
    {
      label: "Admin",
      href: "/admin",
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
