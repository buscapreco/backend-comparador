# Price Comparator - Implementation Plan & Status

## 1. Project Overview
**Goal**: A price comparison tool embedded in a Blogger site, scraping Brazilian e-commerce sites.
**Current State**: Functional locally and deployed on Render.

## 2. Infrastructure & Deployment
- **Hosting**: [Render](https://render.com)
- **Containerization**: Docker (Puppeteer configured with Chrome via apt-get)
- **Deployment Strategy**: 
  - **Manual Push**: User pushes changes to GitHub.
  - **CI/CD**: Render automatically builds and deploys from the GitHub repository.
- **Port**: Application runs on port `3000`.

## 3. File Inventory & Management

### Production Files (GitHub & Render)
These files are critical for the application to run in production:
- `Dockerfile`: Configured for Node.js + Puppeteer (Chrome installation). **DO NOT EDIT without permission.**
- `.dockerignore`: Excludes unnecessary files from the Docker build context.
- `.gitignore`: Ensures secrets and heavy dependencies are not committed.
- `package.json` / `package-lock.json`: Dependency management.
- `server.js`: Main application logic (Express server + Scrapers).
- `public/`: Frontend assets (CSS, JS, Images).
- `blogger_template.html`: The HTML template for the Blogger integration.
- Logic Scripts: `debug_*.js`, `verify_*.js`, etc.

### Local-Only Files (Development)
These files exist only on the local machine and are ignored by Git:
- `node_modules/`: Dependencies (ignored for performance).
- `DEPLOY_GCP.md`: Legacy deployment docs (ignored for security).
- `npm-debug.log`: Debug logs.
- `.env`: Environment variables (if any).
- `.git/`: Repository metadata.

## 4. Workflow Rules
1. **Code Maintenance**: Focus on keeping the code working locally on port `3000`.
2. **Edits**: Only edit code when explicitly requested by the user.
3. **Version Control**: Do NOT attempt to commit or push. The user handles `git push`.
4. **Configuration**: Do NOT modify `Dockerfile` or `package.json` unless necessary and approved.

## 5. Current Tasks
- [x] Update Implementation Plan to reflect Render migration.
- [ ] Maintain `server.js` stability.
- [ ] Await user requests for feature updates or bug fixes.
