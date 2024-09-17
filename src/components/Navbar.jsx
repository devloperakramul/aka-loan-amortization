"use client";

import Link from "next/link";
import React from "react";


const links = [
  {
    id: 1,
    title: "Home",
    url: "/",
  },
  // {
  //   id: 2,
  //   title: "Loans",
  //   url: "/loans",
  // },
  {
    id: 3,
    title: "amortization schedule",
    url: "/combined",
  },


];

const Navbar = () => (
  <nav className="h-[100px] flex justify-around items-center">
    <Link href="/" className="font-bold text-[16px]">
      Devrloped by Akramul Jakir
    </Link>
    <ul className="flex items-center gap-6 text-[22px] font-bold capitalize">
      {links.map(({ id, title, url }) => (
        <li key={id}>
          <Link href={url}>{title}</Link>
        </li>
      ))}
    </ul>
  </nav>
);

export default Navbar;
