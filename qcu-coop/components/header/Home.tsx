"use client";
import Image from "next/image";
import Link from "next/link";
import Cart from "../cart/Cart";
import "@/styles/globals.css";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import classNames from "classnames";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const navigationMobile = [
  {
    name: "products",
    link: "/products",
    src: "/icons/dashboard/products-icon.svg",
  },
  { name: "home", link: "/", src: "/icons/dashboard/home-icon.svg" },
  { name: "about", link: "/about", src: "/icons/dashboard/about-icon.svg" },
];
const navigation = [
  { name: "home", link: "/", src: "/icons/home1-icon.png" },
  { name: "about", link: "/about", src: "/icons/about-icon.png" },
  { name: "products", link: "/products", src: "/icons/cube-icon.png" },
];

const HomeHeader = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState<string>("");

  const handleSearch = () => {
    if (search === "") return router.push(`/products`);
    const params = new URLSearchParams();
    params.append("search", search);
    router.push(`/products?${params}`);
  };
  return (
    <>
      <header className="flex justify-between items-center px-3 z-50 bg-custom-blue-background fixed top-0 left-0 w-full h-user-header-mobile md:bg-gradient-to-r md:from-white md:to-white md:h-user-header">
        <div
          id="logo-heading-container"
          className="flex space-x-2 items-center md:space-x-3"
        >
          <Link href="/" className="relative w-10 h-10 md:w-18 md:h-18">
            <Image
              src="/images/qcu-logo.png"
              alt="QCU-Logo"
              sizes="min-w-1"
              fill
            />
          </Link>
          <h1 className="font-bold text-base md:text-xl text-white md:text-black text-center">
            QCU COOP STORE
          </h1>
        </div>

        <div
          id="search-cart-container"
          className="flex justify-center items-center space-x-2 z-50"
        >
          <div className="md:hidden w-full h-8 rounded-md relative">
            <Search
              className="absolute top-[50%] left-2 translate-y-[-50%]"
              size="20"
            />
            <Input
              type="search"
              placeholder="Search products"
              className="w-full pl-8"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.code === "Enter" && handleSearch()}
            />
          </div>
          <div className="relative md:hidden">
            <Cart />
          </div>
          <Link href="/login" className="hidden md:block relative w-10 h-10">
            <Image
              src="/icons/user-icon.svg"
              alt="user-icon"
              sizes="min-w-1"
              fill
            />
          </Link>
        </div>
      </header>

      <nav className="bg-navbar-user w-screen h-user-navbar-mobile fixed left-0 max-md:bottom-0 md:top-[var(--h-user-header)] md:bg-custom-blue-background md:h-user-navbar md:flex md:justify-between md:items-center z-50">
        <div
          id="mobile-icon-container"
          className="flex justify-around md:hidden"
        >
          {navigationMobile.map((nav, index) => (
            <Link key={index} href={nav.link}>
              <div
                className={classNames({
                  "relative w-9 h-9 hover:-translate-y-1 transition-all object-contain":
                    true,
                  "-translate-y-1": pathname === nav.link,
                })}
              >
                <Image src={nav.src} alt={nav.name} sizes="min-w-1" fill />
              </div>
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center h-full bg-navbar-user ">
          {navigation.map((nav, index) => (
            <Link
              key={index}
              href={nav.link}
              className={classNames({
                "bg-[#5CD2E6] text-black": pathname === nav.link,
                "bg-navbar-user text-white": pathname !== nav.link,
                " h-full": true,
              })}
            >
              <p className="flex justify-center items-center capitalize font-bold text-xl h-full w-full white hover:-translate-y-1 transition-all px-7">
                {nav.name}
              </p>
            </Link>
          ))}
        </div>
        <div
          id="search-cart-container"
          className="hidden md:flex justify-center h-full w-[30%] items-center mr-9 space-x-3 "
        >
          <div className="w-full rounded-md relative">
            <Search
              className="absolute top-[50%] left-2 translate-y-[-50%]"
              size="20"
            />
            <Input
              type="search"
              placeholder="Search products"
              className="w-full pl-8"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.code === "Enter" && handleSearch()}
            />
          </div>
          <div className="relative">
            <Cart />
          </div>
        </div>
      </nav>
    </>
  );
};

export default HomeHeader;
