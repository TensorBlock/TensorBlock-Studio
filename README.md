# TensorBlock Studio

> A lightweight, open, and extensible multi-LLM interaction studio.  
> Part of the [TensorBlock](https://tensorblock.co) ecosystem — built to empower anyone to build with AI from anywhere, not just use it.

![TensorBlock Studio Banner](https://github.com/TensorBlock/TensorBlock-Studio/blob/dev-production-milestone%231/docs/imgs/TensorBlock%20Studio%20Banner.png?raw=true)

## What Makes TensorBlock Studio Different?

Forget generic AI chat tools. **TensorBlock Studio** is a new kind of workspace — one that's lightweight, developer-friendly, and yet welcoming to beginners. It's designed around control, clarity, and creation.

## Features

- Multiple LLM provider
- Web search compatible
- Multi-language UI and prompt support
- Beginner-friendly experience
- Framer Motion UI transitions
- Local-first data storage for speed and privacy

![TensorBlock Studio Screenshot 01](https://github.com/TensorBlock/TensorBlock-Studio/blob/dev-production-milestone%231/docs/imgs/TensorBlock%20Studio%20Screenshot01.png?raw=true)

![TensorBlock Studio Screenshot 01](https://github.com/TensorBlock/TensorBlock-Studio/blob/dev-production-milestone%231/docs/imgs/TensorBlock%20Studio%20Screenshot02.png?raw=true)

![TensorBlock Studio Screenshot 01](https://github.com/TensorBlock/TensorBlock-Studio/blob/dev-production-milestone%231/docs/imgs/TensorBlock%20Studio%20Screenshot03.png?raw=true)

---

# Short-Term Roadmap

- Sharing and exports
- Collection of knowledge pieces
- Mobile-friendly UI (PWA or native shell)
- Plugin system for extensions and custom logic
- More themes

# Tech Stack

- Framework: Next.js 14
- UI: Tailwind CSS + ShadCN + Framer Motion
- State: Zustand
- LLM Routing: Custom Forge Layer
- Storage: IndexedDB / localStorage
- i18n: i18next

---

# Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/TensorBlock/TensorBlock-Studio.git
   cd tensorblock-studio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the application in development mode:

```bash
npm run dev
```

### Building for Production

Package the application for your current platform:

```bash
npm run electron:build:current_platform
```

---

# 📄 Documentation

Comprehensive documentation is available in the `docs` directory:

- [Documentation Index](docs/docs_index.md) - Main documentation entry point with links to all sections
- [Overview](docs/overview.md) - System architecture and high-level application design

---

# Contributing

We're a tiny team (1 designer, 1 frontend, 1 PM) building the tools we wish existed.  
Pull requests, bug reports, and feedback are always welcome!

---

# License

MIT