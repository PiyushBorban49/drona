import asyncio

async def test():
    print(f"Checking if asyncio has create_subprocess_exec: {hasattr(asyncio, 'create_subprocess_exec')}")
    try:
        # Just check if we can call it (it should at least start the call even if command fails)
        process = await asyncio.create_subprocess_exec(
            "python", "--version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        print(f"Subprocess call successful. Return code: {process.returncode}")
        print(f"STDOUT: {stdout.decode().strip()}")
    except Exception as e:
        print(f"Subprocess call failed (expected if python not in path, but shouldn't be AttributeError): {e}")

if __name__ == "__main__":
    asyncio.run(test())
