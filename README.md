![TensorBlock Logo Header](https://github.com/user-attachments/assets/05d37936-3cd3-4b26-af27-07f0d1d06f22)

# TensorBlock Studio

[![Twitter](https://img.shields.io/twitter/follow/tensorblock_aoi?style=social)](https://twitter.com/tensorblock_aoi)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-5865F2?logo=discord&logoColor=white)](https://discord.gg/Ej5NmeHFf2)
[![Telegram](https://img.shields.io/badge/Telegram-Group-blue?logo=telegram)](https://t.me/TensorBlock)
![GitHub Repo stars](https://img.shields.io/github/stars/TensorBlock/TensorBlock-Studio)
![GitHub forks](https://img.shields.io/github/forks/TensorBlock/TensorBlock-Studio)

> A lightweight, open, and extensible multi-LLM interaction studio.  
> Part of the [TensorBlock](https://tensorblock.co) ecosystem — built to empower anyone to build with AI from anywhere, not just use it.

<br>

![TensorBlock Studio Banner](https://github.com/user-attachments/assets/07742418-21e4-41b2-bb61-21ffc158b202)

<br>

## What Makes TensorBlock Studio Different?

Forget generic AI chat tools. **TensorBlock Studio** is a new kind of workspace — one that's lightweight, developer-friendly, and yet welcoming to beginners. It's designed around control, clarity, and creation.

<br>

## Features

### 🎨 Interaction & Creation
- Image generation with support for multiple providers  
- Translation scenarios for multilingual workflows  
- Framer Motion UI transitions for smooth experience

![TensorBlock Studio Image Generation Page](https://github.com/user-attachments/assets/24ec4f29-a3b2-41cc-b9d7-0467f5e470ef)

![TensorBlock Studio Translation Page](https://github.com/user-attachments/assets/9f5b6a9f-d6dc-4082-a990-4988ce31c14c)



<br>

### 🧠 Intelligence & Memory
- File memory store: attach files and persist context across chats  
- Conversational agents powered by multiple LLM providers  
- Web search integration for real-time answers

![TensorBlock Studio File Management Page](https://github.com/user-attachments/assets/e4183ae9-b4e1-466e-83ce-de0c5ef1535f)

![TensorBlock Studio Chat Page](https://github.com/user-attachments/assets/ae7f338b-f997-4594-b393-b5e6cb460ef9)

<br>

### ⚙️ User Experience & Customization
- Configurable startup settings  
- Multi-language UI and prompt support  
- Local-first data storage for speed and privacy  
- Beginner-friendly interface  

![TensorBlock Studio Model Management Page](https://github.com/user-attachments/assets/d5fdf982-c22c-4655-92d0-506cf1faadee)

![TensorBlock Studio Model Selection Page](https://github.com/user-attachments/assets/4a3e9e07-e09a-41c1-8941-7fa5b59f4342)

<br>

# 🎯Short-Term Roadmap

- [ ] Sharing and exports
- [ ] Collection of knowledge pieces
- [ ] Mobile-friendly UI (PWA or native shell)
- [ ] Plugin system for extensions and custom logic
- [ ] More themes

<br>

# 🔩Tech Stack

- Framework: Typescript + Node.js 18 + React + Vite + Electron
- UI: Tailwind CSS
- LLM Routing: @ai/sdk
- Storage: IndexedDB / localStorage
- i18n: i18next

<br>

![Getting Started Header](https://github.com/user-attachments/assets/4976e502-9e89-45c4-bb9c-fa9453a76bb0)

# ⭐Getting Started

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

<br>

# 📄 Documentation

Comprehensive documentation is available in the `docs` directory:

- [Documentation Index](docs/docs_index.md) - Main documentation entry point with links to all sections
- [Overview](docs/overview.md) - System architecture and high-level application design

<br>

# 🤝Contributing

We welcome contributions from the community!

### Contributing Steps
1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Make your changes
4. Run tests to ensure everything works
5. Commit your changes (git commit -m 'Add amazing feature')
6. Push to your branch (git push origin feature/amazing-feature)
7. Open a Pull Request

### Development Guidelines
- Follow the [Code Style Guide](docs/CODE_STYLE_GUIDE.md)
- Write tests for new features
- Update documentation for any changes
- See [Contributing Guide](docs/CONTRIBUTING.md) for detailed guidelines

<br>

# 📄License

Please check [License](LICENSE)
