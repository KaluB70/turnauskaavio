# Build Angular app
Write-Host "Building Angular app..."
npm install
ng build --base-href="/turnauskaavio/"

# Create a temp directory outside of Git
$tempDir = "$env:TEMP\angular-deploy-$(Get-Random)"
New-Item -Path $tempDir -ItemType Directory -Force

# Copy the build output to the temp directory
Write-Host "Copying build files to temporary location: $tempDir"
Copy-Item -Path "dist/turnaus/browser/*" -Destination $tempDir -Recurse

# Verify files were copied to temp
if (Test-Path "$tempDir\index.html") {
    Write-Host "Files successfully copied to temp directory"
    Get-ChildItem -Path $tempDir | ForEach-Object { Write-Host "- $($_.Name)" }
    
    # Switch to gh-pages branch
    try {
        git checkout gh-pages
        Write-Host "Switched to existing gh-pages branch"
    } catch {
        git checkout -b gh-pages
        Write-Host "Created new gh-pages branch"
    }
    
    # Clear the branch, keeping only .git
    Get-ChildItem -Path . -Exclude .git | Remove-Item -Recurse -Force
    
    # Copy from temp directory to root
    Write-Host "Copying from temp directory to repository root"
    Copy-Item -Path "$tempDir\*" -Destination . -Recurse
    
    # Create .nojekyll file
    New-Item -Path ".nojekyll" -ItemType File -Force
    
    # Verify index.html exists
    if (Test-Path "index.html") {
        Write-Host "index.html confirmed in root directory"
        
        # Add, commit, and push
        git add .
        git commit -m "Deploy Angular app to GitHub Pages"
        git push origin gh-pages --force
        
        Write-Host "Deployment completed. Wait for GitHub Pages to update (may take a few minutes)."
    } else {
        Write-Error "index.html is missing from repository root!"
    }
    
    # Clean up and return to main branch
    Write-Host "Cleaning up temporary directory"
    Remove-Item -Path $tempDir -Recurse -Force
    git checkout main
} else {
    Write-Error "Failed to copy build files to temp directory!"
}