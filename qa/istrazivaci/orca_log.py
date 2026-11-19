"""Give Orca a terminal so each debug line reaches the measurement file immediately."""
import os
import pty
import select
import subprocess
import sys
import tty


def main(destination):
    master, slave = pty.openpty()
    tty.setraw(slave)
    # Orca opens --debug-file in text mode. A terminal enables Python line buffering.
    with open(destination, 'wb', buffering=0) as output:
        orca = subprocess.Popen(['orca', '--replace', '--debug', '--debug-file=' + os.ttyname(slave)])
        try:
            while True:
                if select.select([master], [], [], .25)[0]:
                    output.write(os.read(master, 65536))
                elif orca.poll() is not None:
                    return orca.returncode
        finally:
            os.close(master)
            os.close(slave)


if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
