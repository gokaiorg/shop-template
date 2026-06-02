1. **Optimize Firestore Queries in Product Page**
   - Use `replace_with_git_merge_diff` to modify `src/app/[lang]/(shop)/product/[slug]/page.tsx`.
   - Wrap the Firestore product fetch in a `React.cache()` function to prevent it from executing twice per request (once in `generateMetadata` and once in the page component).
2. **Verify changes**
   - Run `pnpm lint` and `pnpm build` to verify the code changes do not break the application.
3. **Complete pre-commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
4. **Submit PR**
   - Submit the PR with standard Bolt formatting, detailing the impact (reducing DB hits by 50% for product pages).
