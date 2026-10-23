"""Pure, network-free Galaxy static-release byte parity verification.

The approved AI_READY deploy injects exactly one public endpoint into a staged
runtime-config.js; everything else is byte-for-byte the checked-out source.
"""
from hashlib import sha256

APPROVED_EVALUATOR = (
    "https://gengalaxy-p3-1429841605.azurewebsites.net/api/practice/evaluate"
)
EVAL_DEFAULT = "window.GALAXY_EVALUATOR_URL='';"
EVAL_APPROVED = "window.GALAXY_EVALUATOR_URL='" + APPROVED_EVALUATOR + "';"


def verify_public_asset(path, downloaded, local):
    if path == "runtime-config.js":
        local_text = local.decode("utf-8")
        hosted_text = downloaded.decode("utf-8")
        assert local_text.count(EVAL_DEFAULT) == 1, "Unexpected runtime configuration source"
        expected = local_text.replace(EVAL_DEFAULT, EVAL_APPROVED)
        assert hosted_text == expected, (
            "Hosted evaluator URL, disabled Vault/Speech settings or "
            "other runtime config differs from approved AI_READY staging"
        )
        assert "window.GALAXY_VAULT_EXTRACT_URL='';" in hosted_text
        assert "window.GALAXY_SPEECH_BROKER_URL='';" in hosted_text
    else:
        assert sha256(downloaded).digest() == sha256(local).digest(), (
            f"{path}: hosted bytes differ from checked-out main; "
            "deploy this reviewed commit before claiming live acceptance"
        )
