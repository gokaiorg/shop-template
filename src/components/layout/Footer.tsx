import React from 'react';

export function Footer() {
    return (
        <footer className="pt-10 mt-auto text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()}. Made with AI by <a href="https://gokai.org" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-foreground transition-colors">Gokai Labs</a>
        </footer>
    );
}
