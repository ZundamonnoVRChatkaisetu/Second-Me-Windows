import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X, Home, MessageSquare, Settings, User, Database, FolderOpen, Brain } from 'lucide-react';
import { Button } from '../ui/Button';

const NavigationHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };

  const navItems = [
    {
      name: 'ホーム',
      path: '/',
      icon: <Home className="h-5 w-5 mr-2" />,
    },
    {
      name: 'チャット',
      path: '/chat',
      icon: <MessageSquare className="h-5 w-5 mr-2" />,
    },
    {
      name: 'プロファイル',
      path: '/profiles',
      icon: <User className="h-5 w-5 mr-2" />,
    },
    {
      name: 'メモリー',
      path: '/memory',
      icon: <Database className="h-5 w-5 mr-2" />,
    },
    {
      name: 'WorkSpace',
      path: '/workspace',
      icon: <FolderOpen className="h-5 w-5 mr-2" />,
    },
    {
      name: 'トレーニング',
      path: '/training',
      icon: <Brain className="h-5 w-5 mr-2" />,
    },
    {
      name: '設定',
      path: '/settings',
      icon: <Settings className="h-5 w-5 mr-2" />,
    },
  ];

  return (
    <header className="bg-white border-b py-3 px-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl">Second Me</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                isActive(item.path)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMenu}
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-x-0 z-50 bg-white border-b shadow-lg animate-in fade-in slide-in-from-top-5 duration-300">
          <nav className="container mx-auto py-4 px-4 flex flex-col space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center px-3 py-3 rounded-md transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavigationHeader;
