# Public-source security, lesson quality and cost review — P2 F

This report is a **review plan**, not expert signoff or evidence of a live penetration test. GitHub repo `saifsiddiqui59/GenAI-Galaxy` is now **public**, including commit history; the Azure Blob public preview is a separate, older deployment.

## Public-source and history audit

- Repo checks on PRs reject common credential token shapes in public frontend assets, known local settings files, and some cross-project publishing paths. These checks are **not exhaustive**; static regex scanning misses encoded secrets, environment-specific keys and history that is no longer in the working tree.
- Before publishing more code, review `git log --all --stat`, historical blobs and GitHub Actions logs for previously committed keys, uploaded resumes, phone numbers, private documents, service-role credentials, shared tenant identifiers and hardcoded provider tokens. Keep a private evidence log; never post actual secrets in issues.
- If a real key is discovered, revoke/rotate it at its issuer before history cleanup. Rewriting history alone does not revoke a copied credential. Protect privacy of personal uploads and keep `genai-study-docs` non-public with server-side RLS.
- Ensure `.github/workflows/galaxy-ci.yml` contains no deployment steps or access to `dev` secrets; manual protected workflows are separately authorized.

## Editorial lesson quality review

- Source has **167 distinct expanded lesson records** for **168/246 topic entries**, plus **78 overview-only entries**. Eight sections and passing keyword checks do not mean factual or SME verification.
- For each authored lesson record, track original source/version, reviewer identity, date, confidence/ambiguities, supported technical claims, technical mistakes, and a real 30–60-second spoken-answer timing check.
- Review Azure API/Foundry/Speech security, Supabase RLS, banking/finance tool confirmation, statistical anomaly detection and data engineering edge cases first. Require a golden prompt, a misleading adversarial prompt, accurate answer, grounded references and an explicit candidate correction for failures.
- Maintain original V3 topic keys and do not silently claim user resume achievements or production use where only a prototype exists.

## Budget and telemetry design (no live Azure writes)

- Frontend Blob cost must be estimated using **actual region/tier published prices**, not a hardcoded unverified dollar amount. An estimate separates stored GB-month × storage unit rate, read/write requests × transaction rates, egress GB × region egress rate, and any fixed monitoring/operational costs.
- Example sensitivity formula: `monthly_cost = stored_gb * gb_month_rate + (read_ops/10000) * read_10k_rate + (write_ops/10000) * write_10k_rate + egress_gb * egress_gb_rate + monitor_cost`. All rates stay unspecified until verified for the actual subscription; **not** a live price quote.
- Track website GET status, cache hit ratio, bandwidth, daily 4xx/5xx, and storage size. Model/Speech/APIM/Functions are **not deployed** and must not be represented as zero-cost production traffic or production-ready architecture.
- Owner should approve any real Azure Budget alert creation; a source-only report does not create an alert or enforce a spend limit.

## Release gates still open

Separate owner approval is required for the hosted two-account RLS probe, actual microphone/provider test, redeploying the existing Blob website, new Azure backend resources, and any paid cost-monitoring action. Do not merge claims of SME signoff into coverage metrics without source evidence.
