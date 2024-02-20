# Sermin

Sermin is a modern, open-source, and high-performance application for managing your server databases. You can setup your cronjobs, databases and s3 buckets in a few clicks

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/rharkor/sermine/blob/main/LICENSE)

# demo video

![Demo](./demo.gif)

Based on [Next.js Boilerplate](https://github.com/rharkor/next-boilerplate), an open-source template for all your nextjs projects!
<br />
<br />
This project is not intended to be used as a SaaS but as a self-hosted application. All informations stored in the database are very sensitive and should not be shared with anyone. The application is not responsible for any data loss or security breach. It is your responsibility to secure your server and your database.

## 📚 Features

With this template, you get all the awesomeness you need:

- **Cronjobs**: Manage your cronjobs in a few clicks
- **Databases**: Manage your databases in a few clicks
- **S3 Buckets**: Manage your s3 buckets in a few clicks

## 🚀 Getting Started

To get started with this project, you can follow these steps:

1. Clone the repository

```bash
git clone https://github.com/rharkor/sermin
```

2. Rename the .env.example file to .env and fill in the environment variables

3. Run the following command to start the application

```bash
cp .env packages/app/.env && cp .env packages/cron/.env && docker compose up -d
```

4. The application should be available at http://localhost:3000

## 🤝 Contribution

Contributions are always welcome! To contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch with a descriptive name.
3. Make your changes, and commit them using the [Conventional Commits](https://www.conventionalcommits.org/) format.
4. Push your changes to the forked repository.
5. Create a pull request, and we'll review your changes.

## Support

For support, contact me on discord at `ryzer` or by email at `louis@huort.com`.

## 📜 License

This project is licensed under the MIT License. For more information, see the [LICENSE](./LICENSE) file.
