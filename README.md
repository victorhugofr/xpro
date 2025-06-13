# XPath Generator Pro

![XPro Logo](XPRO.svg)

A professional Chrome extension that generates intelligent XPaths, avoiding volatile indices and prioritizing stable attributes, with visual reliability classification. Additionally, it automatically generates ready-to-use code snippets for Cypress, Selenium (Java/Python), and Playwright.

## Main Features

- **Intelligent XPath**: Avoids volatile indices and prioritizes unique IDs, stable attributes like data-testid, name, and aria-label.
- **Visual Classification**: A color-coded system (Green/Yellow/Red) that indicates the robustness and reliability of the generated XPath.
- **Code Snippets**: Automatically generates ready-to-use code snippets for Cypress, Selenium (Java/Python), and Playwright.

## How to Install the Extension

Follow these steps to install the XPath Generator Pro extension in Chrome:

1.  **Download the extension files**: Download the files from the `/public` folder.
2.  **Open Chrome extensions**: Type `chrome://extensions/` in the address bar.
3.  **Enable developer mode**: Click the "Developer mode" toggle.
4.  **Load the extension**: Click "Load unpacked" and select the extension files folder.

### How to use:

*   Right-click on any element.
*   Select "Generate Intelligent XPath."
*   Or click on the extension icon and select an element.
*   View the reliability classification.
*   Generate snippets for your preferred framework.


## How can I edit this code?

There are several ways to edit your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repository and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly on GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
