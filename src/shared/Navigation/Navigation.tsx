import React from "react";
import NavigationItem from "./NavigationItem";
import { NAVIGATION_DEMO_2 } from "@/data/navigation";

function Navigation() {
  return (
    // <ul className="nc-Navigation flex items-center">
    //   {NAVIGATION_DEMO_2.map((item) => (
    //     <NavigationItem key={item.id} menuItem={item} />
    //   ))}
    // </ul>
    <ul className="nc-Navigation flex items-center">
      {[{id: "1", name: 'Home', href: '/'}].map((item) => (
        <NavigationItem key={item.id} menuItem={item} />
      ))}
    </ul>
  );
}

export default Navigation;
