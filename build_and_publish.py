import os
import shutil
import subprocess
import sys

def run_command(command, cwd=None):
    print(f"Executing: {command} in {cwd or 'current directory'}")
    process = subprocess.run(command, shell=True, cwd=cwd)
    if process.returncode != 0:
        print(f"Error: Command failed with exit code {process.returncode}")
        sys.exit(process.returncode)

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.join(root_dir, "BookStore.Web")
    api_dir = os.path.join(root_dir, "BookStore.Api")
    wwwroot_dir = os.path.join(api_dir, "wwwroot")
    dist_dir = os.path.join(web_dir, "dist")
    publish_dir = os.path.join(root_dir, "publish")

    print("=== STEP 1: Building React Frontend ===")
    # Run npm install if node_modules does not exist
    if not os.path.exists(os.path.join(web_dir, "node_modules")):
        print("node_modules not found, running npm install...")
        run_command("npm install", cwd=web_dir)
    
    # Run build
    run_command("npm run build", cwd=web_dir)

    print("\n=== STEP 2: Preparing wwwroot in API project ===")
    # Clear wwwroot if exists, then recreate
    if os.path.exists(wwwroot_dir):
        print(f"Cleaning existing wwwroot: {wwwroot_dir}")
        shutil.rmtree(wwwroot_dir)
    os.makedirs(wwwroot_dir, exist_ok=True)

    # Copy all files from dist to wwwroot
    print(f"Copying files from {dist_dir} to {wwwroot_dir}...")
    for item in os.listdir(dist_dir):
        s = os.path.join(dist_dir, item)
        d = os.path.join(wwwroot_dir, item)
        if os.path.isdir(s):
            shutil.copytree(s, d)
        else:
            shutil.copy2(s, d)
    print("Static files copied successfully!")

    print("\n=== STEP 3: Publishing .NET Web API ===")
    # Clear publish dir if exists
    if os.path.exists(publish_dir):
        print(f"Cleaning existing publish directory: {publish_dir}")
        shutil.rmtree(publish_dir)
    
    # Run dotnet publish
    publish_cmd = f"dotnet publish -c Release -o \"{publish_dir}\""
    run_command(publish_cmd, cwd=api_dir)

    print("\n==============================================")
    print("SUCCESS: Combined application published successfully!")
    print(f"Deployment Folder: {publish_dir}")
    print("Copy this entire folder to your production server's IIS folder.")
    print("==============================================")

if __name__ == "__main__":
    main()
