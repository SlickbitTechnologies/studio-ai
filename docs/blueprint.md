# **App Name**: CSR DraftWise

## Core Features:

- ICH E3 Section Tree: Displays a navigation tree of ICH E3 CSR sections for easy access.
- Embedded Word Editor: Embeds Microsoft Word Online to offer a full-featured document editing experience directly in the browser.
- Local File Upload: Allows users to upload local files that serve as sources for AI-assisted content generation; file content is used as input to an LLM tool, then immediately discarded.
- AI-Powered Draft Generation: Generates CSR drafts for specified sections using uploaded documents.  Leverages the uploaded content and a targeted prompt to create well-formatted drafts for CSR sections using a LLM tool.
- Draft Insertion: Inserts generated content into the appropriate section in the embedded Word document.
- Secure Authentication: Users can authenticate with email or Google via Firebase Authentication, managing user access without storing personal data. This session based.
- Temporary File Parsing: Parses locally uploaded files, extracts the relevant text content to serve as a context to the AI and removes all the files at the end.

## Style Guidelines:

- Primary color: Subtle blue (#5DADE2) for trustworthiness and efficiency, inspired by medical and tech aesthetics.
- Background color: Light gray (#F5F7FA) for a clean, distraction-free workspace.
- Accent color: Teal (#2ABB9B) for CTAs and important UI elements, promoting a sense of calm and reliability.
- Body font: 'Inter', sans-serif, a grotesque style, is used for clarity and readability, promoting an objective and modern feel.
- Headline font: 'Space Grotesk', sans-serif, is paired for headlines, emphasizing important titles and short texts.
- Simple, clear icons to match the clean layout, aiding in navigation and feature recognition.
- Clean, three-panel layout (ICH E3 Navigator, Word Editor, AI Draft Assistant) like in Microsoft word environment, optimized for efficient medical writing.