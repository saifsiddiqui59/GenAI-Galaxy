# P15-C — Original warp portal (standalone)
Issue #62. Component experience/src/portal/WarpGate.jsx and local CSS. React Bits Hyperspeed was requested as visual inspiration; its current MIT + Commons Clause terms are not plain MIT, so this implementation does not copy its source or shader assets. The result is an original ring-accelerated hyperspace tunnel without dependencies beyond React and CSS. We may later replace with React Bits components only after reviewing the specific licensing and performance impact.

API: WarpGate({request:{id,index},onComplete(index),enabled,reducedMotion}), where request.id is unique per invocation. A completion latch + onAnimationEnd and time cap ensures navigation happens only once; user can Skip at any point. Reduced-motion instantly resolves without a moving corridor. Both ordinary planet selection and Genie accept should invoke the same wrapper.

Not yet integrated into old lesson pages; coordinator owns React entry and navigation bridge. Quality gates include mobile/web accessibility and absence of extra paid/CDN calls. No changes to backend or external repos.
