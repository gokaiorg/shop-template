import time
from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create context and page
        context = browser.new_context(record_video_dir="/tmp/video")
        page = context.new_page()

        print("Navigating to /en/shop...")
        try:
            page.goto("http://localhost:3000/en/shop")
            # Wait for the main heading or shop container to appear instead of fixed timeout
            expect(page.get_by_role("main")).to_be_visible(timeout=10000)

            # The page should just load fine. We just want to make sure it doesn't crash since we changed the data logic
            page.screenshot(path="/tmp/shop_page.png")
            print("Screenshot taken.")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    time.sleep(3) # wait for server to start
    run()
