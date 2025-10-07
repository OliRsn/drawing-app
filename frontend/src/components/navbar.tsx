import { Link } from "@heroui/link";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className="flex justify-start items-center gap-1"
            color="foreground"
            href="/"
          >
            <Logo />
            <p className="font-bold text-inherit">Tirage Au Sort</p>
          </Link>
        </NavbarBrand>

        <div className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <Link
                href={item.href}
                className="text-sm font-medium text-foreground hover:text-primary"
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </div>
      </NavbarContent>

      <NavbarContent justify="end">
        {isAuthenticated ? (
          <>
            {user?.is_admin && (
              <NavbarItem>
                <Button as={Link} color="primary" href="/admin" variant="flat">
                  Admin
                </Button>
              </NavbarItem>
            )}
            <NavbarItem>
              <Button as={Link} color="secondary" href="/profile" variant="flat">
                Profile
              </Button>
            </NavbarItem>
            <NavbarItem>
              <Button color="danger" variant="flat" onPress={handleLogout}>
                Logout
              </Button>
            </NavbarItem>
          </>
        ) : (
          <NavbarItem>
            <Button as={Link} color="primary" href="/login" variant="flat">
              Login
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>
    </HeroUINavbar>
  );
};
