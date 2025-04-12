# LinkedIn Profile Field Migration

This migration adds a LinkedIn profile field to user profiles in FilmVault.

## What This Migration Does

1. Adds a `LinkedInLink` column to the `users` table in the database
2. Updates the API routes to handle the new field
3. Adds LinkedIn field to the profile page UI

## Running the Migration

To run the database migration:

```bash
# Navigate to the server directory
cd /path/to/FilmVault/server

# Run the migration script
npm run migrate-linkedin
```

## Verifying the Migration

After running the migration, you can verify it was successful by:

1. Checking the database schema:
   ```sql
   DESCRIBE users;
   ```
   You should see a `LinkedInLink` column with type `VARCHAR(255)`.

2. Testing the profile page:
   - Log in to the application
   - Navigate to your profile
   - Edit your profile and add a LinkedIn link
   - Save and verify the link appears in your profile

## Troubleshooting

If you encounter any issues:

- Check the server logs for error messages
- Ensure the database connection is working properly
- Verify that the `users` table exists
- Check if the column already exists (the migration will fail if it does)