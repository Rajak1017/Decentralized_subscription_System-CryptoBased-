from django.core.management.base import BaseCommand, CommandParser
from subscriptions.models import Wallet


class Command(BaseCommand):
    help = "Create or promote a wallet address as an admin (no username/password)."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--address", "-a", type=str, help="Wallet address to promote as admin")
        parser.add_argument("--noinput", action="store_true", help="Do not prompt for input (requires --address)")

    def handle(self, *args, **options):
        address: str | None = options.get("address")
        if not address and options.get("noinput"):
            self.stderr.write(self.style.ERROR("--address is required with --noinput"))
            return 1

        while not address:
            address = input("Wallet address: ").strip()
            if not address:
                self.stderr.write("Address cannot be empty.")

        wallet, created = Wallet.objects.update_or_create(
            address=address.strip(), defaults={"is_admin": True}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created admin wallet: {wallet.address}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Updated admin wallet: {wallet.address} (is_admin=True)"))
        return 0


