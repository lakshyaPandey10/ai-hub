import { Bot, Newspaper, Cloud, Code, Mail, Instagram, UserCircle, Sparkles, Languages, StickyNote, Eraser, FileText, Music, QrCode, Code2, Link2, Terminal, Grid3X3, Gamepad2, Brain, Download, Trophy, Info, Star } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "AI Chat", url: "/dashboard", icon: Bot },
  { title: "News", url: "/dashboard/news", icon: Newspaper },
  { title: "Weather", url: "/dashboard/weather", icon: Cloud },
  { title: "Image Generator", url: "/dashboard/image-gen", icon: Sparkles },
  { title: "BG Remover", url: "/dashboard/bg-remover", icon: Eraser },
  { title: "PDF Chat", url: "/dashboard/pdf-chat", icon: FileText },
  { title: "Music Generator", url: "/dashboard/music-gen", icon: Music },
  { title: "Translator", url: "/dashboard/translator", icon: Languages },
  { title: "Notes", url: "/dashboard/notes", icon: StickyNote },
  { title: "QR Generator", url: "/dashboard/qr-gen", icon: QrCode },
  { title: "Code Playground", url: "/dashboard/code-gen", icon: Code2 },
  { title: "Python Runner", url: "/dashboard/python", icon: Terminal },
  { title: "URL Shortener", url: "/dashboard/url-short", icon: Link2 },
  { title: "Tic Tac Toe", url: "/dashboard/tic-tac-toe", icon: Grid3X3 },
  { title: "Snake Game", url: "/dashboard/snake", icon: Gamepad2 },
  { title: "Memory Game", url: "/dashboard/memory", icon: Brain },
  { title: "Cricket Score", url: "/dashboard/cricket", icon: Trophy },
  { title: "Source Code", url: "/dashboard/source-code", icon: Code },
  { title: "Install App", url: "/dashboard/install", icon: Download },
  { title: "About", url: "/dashboard/about", icon: Info },
  { title: "Feedback", url: "/dashboard/feedback", icon: Star },
  { title: "Profile", url: "/dashboard/profile", icon: UserCircle },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleMenuItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleContactClick = () => {
    handleMenuItemClick();
    window.location.href = "mailto:typeforyou11@gmail.com?subject=Contact%20from%20AI%20Hub";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-xs gradient-text tracking-wider">
            AI HUB
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      onClick={handleMenuItemClick}
                      className="hover:bg-muted/50 transition-all duration-200"
                      activeClassName="bg-primary/10 text-primary font-medium neon-border"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleContactClick}
                  tooltip="Contact Us"
                >
                  <Mail className="h-4 w-4" />
                  {!collapsed && <span>Contact Us</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <a
          href="https://www.instagram.com/_lakshhh__18/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors group"
        >
          <Instagram className="h-4 w-4 shrink-0 group-hover:text-accent transition-colors" />
          {!collapsed && <span>Made by <strong className="text-foreground group-hover:gradient-text transition-all">Laksh Pandey</strong></span>}
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}
