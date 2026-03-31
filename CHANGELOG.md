# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-03-31

### Added
- Enable encryption by default using AES-256-CBC
- Vite demo app with Firebase anonymous auth

### Fixed
- Align cross-platform encryption format and key derivation
- Resolve all eslint errors
- Guard against undefined members in ChatList and missing doc in updateUnread
- Handle Firestore Timestamp objects in formatMessageData

### Changed
- Configure package for npm release

## [1.0.0] - 2024-09-24

### Added
- Initial release of react-firebase-chat
- Real-time messaging with Firebase integration
- Cross-platform compatibility with React Native
- Modern UI components with TypeScript support
- User authentication and management
- File upload and camera integration
- Gallery view for media messages
- Typing indicators and connection status
- Message encryption utilities
- Responsive design with Tailwind CSS

### Features
- **SimpleChat**: No authentication required chat
- **Firebase Integration**: Real-time synchronization
- **Cross-Platform**: Works with React Native apps
- **TypeScript**: Full type safety
- **Modern UI**: Beautiful, responsive design
- **Addons**: Camera, file upload, and gallery components