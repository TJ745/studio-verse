import type { Metadata } from "next";
// import "./globals.css";

export const metadata: Metadata = {
  title: "StudioVerse — AI Image Generator",
  description:
    "Generate stunning images with DALL·E 3, 12 style presets, and GPT-4o powered prompt enhancement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
 
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
 
          :root {
            --obsidian:  #0a0a0c;
            --void:      #060608;
            --panel:     #0e0e12;
            --panel2:    #111116;
            --border:    #1a1a22;
            --border2:   #222230;
            --gold:      #c8a96e;
            --gold-dim:  #7a6540;
            --gold-glow: rgba(200,169,110,0.12);
            --accent:    #e8c46b;
            --text:      #e8e4dc;
            --text2:     #a8a4a0;
            --muted:     #5a5868;
            --danger:    #c86e6e;
            --success:   #6ec88a;
          }
 
          html { scroll-behavior: smooth; }
 
          body {
            background: var(--void);
            color: var(--text);
            font-family: 'DM Sans', sans-serif;
            font-weight: 300;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            overflow-x: hidden;
          }
 
          /* Global scrollbar */
          ::-webkit-scrollbar { width: 4px; height: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
          ::-webkit-scrollbar-thumb:hover { background: var(--gold-dim); }
 
          /* Selection */
          ::selection { background: rgba(200,169,110,0.2); color: var(--text); }
 
          /* Focus outline */
          :focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; border-radius: 4px; }
 
          /* App shell layout (global, used in app layout) */
          .app-shell {
            display: flex;
            height: 100vh;
            overflow: hidden;
          }
 
          .app-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            min-width: 0;
          }
 
          .app-content {
            flex: 1;
            overflow-y: auto;
            padding: 32px;
            background: var(--void);
            position: relative;
          }
 
          .app-content::before {
            content: '';
            position: fixed;
            inset: 0;
            background-image:
              linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
            background-size: 48px 48px;
            pointer-events: none;
            z-index: 0;
          }
 
          .app-content > * { position: relative; z-index: 1; }
        `}</style>
        {children}
      </body>
    </html>
  );
}
