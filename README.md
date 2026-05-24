# SecLayers

An interactive, visual Application Security learning platform covering 41 chapters across 7 acts — from Secure Design fundamentals through Web, API, Mobile, Systems, Cloud, and Supply Chain security. Each chapter includes interactive tools, real exploit demos, KaTeX-rendered theory, and an interview/exam mode.

## Getting Started

### Local Development

```bash
npm install
npm run dev
```

App runs at `http://localhost:3020`.

### Run with Docker

```bash
docker build -t seclayers .
docker run -p 3020:3000 seclayers
```

App runs at `http://localhost:3020`.

To run in the background:

```bash
docker run -d -p 3020:3000 --name seclayers-test seclayers
docker restart seclayers-test          # to reboot
docker stop seclayers-test && docker rm seclayers-test  # to stop
```

To rebuild after code changes:

```bash
docker stop seclayers && docker rm seclayers && docker build -t seclayers . && docker run -d -p 3020:3000 --name seclayers-test seclayers
```

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router, static + SSG)
- [Tailwind CSS](https://tailwindcss.com/)
- [MDX](https://mdxjs.com/) with KaTeX math and syntax highlighting
- [sql.js](https://sql.js.org/) for in-browser SQL labs

## Testing

```bash
npm test
```
