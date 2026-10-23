# P16 isolated Azure Storage 3D preview

Prepared publisher at scripts/p16/preview-publisher.yml and static stager at scripts/p16/stage-preview.sh. Contributor code does not authorize hosted changes.

It requires coordinator to pin the immutable SHA from the final successful integration PR, place workflow on main through a reviewed PR, and let the user manually run GitHub Actions > Galaxy 3D Experience Preview > Run workflow on main with DEPLOY_3D_PREVIEW. GitHub's protected dev environment may request its own review.

Uploads to $web/previews/galaxy-3d-v2 ONLY; never replaces the existing live root. Bundles a nested /lesson/ copy of the established eight-part learning UI so 3D planet choices work from the preview. Built GLB is verified by pinned upstream SHA256 at build. The hosted index, GLB and lesson index bytes are verified over HTTPS, then the actual working preview URL is printed in the workflow summary. This does not call paid model APIs.

No direct Azure workflow dispatch is exposed by the ChatGPT GitHub connector, so neither authoring this workflow nor a green CI run is proof of upload. Do not assert the intended URL works until hosted bytes are verified.
