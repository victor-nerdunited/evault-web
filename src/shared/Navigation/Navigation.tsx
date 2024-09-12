import React from "react";
import NavigationItem, { NavItemType } from "./NavigationItem";
import { NAVIGATION_DEMO_2 } from "@/data/navigation";

function Navigation() {
  const navItems: NavItemType[] = [{
    id: "1", 
    name: 'Home', 
    href: '/'
  }, {
    id: "2", 
    name:"F.A.Q.", 
    href: "https://support.elementunited.com/hc/en-us/sections/29040770721307-Basics",
    targetBlank: true,
  }];
  return (
    // <ul className="nc-Navigation flex items-center">
    //   {NAVIGATION_DEMO_2.map((item) => (
    //     <NavigationItem key={item.id} menuItem={item} />
    //   ))}
    // </ul>
    <ul className="nc-Navigation flex items-center">
      {navItems.map((item) => (
        <NavigationItem key={item.id} menuItem={item} />
      ))}
    </ul>
  );
}

export default Navigation;
