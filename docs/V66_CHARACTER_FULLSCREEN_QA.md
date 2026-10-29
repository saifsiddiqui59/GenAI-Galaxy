# Galaxy V6.6 source review — 29 October 2026

## Owner visual feedback
- Character lacked visible legs and body movement.
- Full 3D galaxy did not fill the page, especially on compact screens.

## Changes
- Experimental anatomical V6 no longer replaces lower legs with an opaque spectral tail.
- Shaped femur/tibia/foot meshes follow the ORIGINAL connected KayKit hip/knee/ankle bones.
- Deterministic hip, knee, ankle, spine and chest motions follow the synchronized story clock. Ground-walk and floor-pickup clips remain disabled; right-hand orbital IK and lesson identity are unchanged.
- The canvas fills the actual device viewport rather than imposing a 700/740px minimum height that could cut off smaller screens.
- Narrow galaxy framing increases slightly (still centered and immutable throughout all collections) and shares the exact layout with planet-to-palm contact geometry.
- New pure motion tests and extended hosted Chromium guards cover real leg geometry, articulated movement and reduced-motion behavior.

## Verification
Source branch only until GitHub's real PR validation is green. The currently reachable V6.5 hosted URL is unchanged and must not be presented as this V6.6 version. A V6.6 Azure preview requires a separate protected release pinned to an exact successful commit and browser screenshot review; no paid model calls or new resources.
