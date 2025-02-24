export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-purple-900 border-t border-purple-500/20 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/cryptokong145"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-purple-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>@cryptokong145</span>
            </a>
            
            <a
              href="https://youtube.com/cryptokong145"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-red-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
              <span>YouTube</span>
            </a>

            <a
              href="https://t.me/cryptokong145"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-blue-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.11-.26.199-.398.342l-.209.203-2.587 2.55c-.54.54-.144.784.435.439l7.763-5.965c.33-.238.66-.22.88.14.219.359.195.84.043 1.2l-1.356 2.8c-.242.5-.421.723-.692.65-.173-.047-.303-.287-.474-.556l-1.83-3.248c-.11-.198-.432-.275-.687-.101l-2.846 2.05c-.34.24-.65.222-.85-.15-.202-.372-.166-.95.114-1.37l4.15-6.348c.22-.34.44-.41.72-.25.28.16.415.5.415.5l1.97 6.28c.09.28.18.25.18.25l.45-.57c.09-.09.18-.15.27-.21l2.024-1.95c.24-.22.48-.1.29.11z"/>
              </svg>
              <span>Telegram</span>
            </a>
          </div>

          <p className="text-sm text-gray-400 mt-4 md:mt-0">
            © {new Date().getFullYear()} CryptoKong145. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
} 