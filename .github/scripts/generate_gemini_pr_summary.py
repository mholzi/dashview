import os
from github import Github
from google.generativeai import GenerativeModel, configure

# --- Configuration and Environment Variables ---
# These variables are passed from the GitHub Actions workflow
github_token = os.getenv("GITHUB_TOKEN")
gemini_api_key = os.getenv("GEMINI_API_KEY")
pr_number_str = os.getenv("PR_NUMBER") # The PR number as a string
repository_name = os.getenv("REPOSITORY")  # e.g., "your-username/your-repo"
pr_diff = os.getenv("PR_DIFF") # The diff content fetched by the workflow step

# Verify essential environment variables are present
if not github_token:
    print("Error: GITHUB_TOKEN environment variable not set.")
    exit(1)
if not gemini_api_key:
    print("Error: GEMINI_API_KEY environment variable not set. Please add it to GitHub Secrets.")
    exit(1)
if not pr_number_str:
    print("Error: PR_NUMBER environment variable not set.")
    exit(1)
if not repository_name:
    print("Error: REPOSITORY environment variable not set.")
    exit(1)
if not pr_diff:
    print("Warning: PR_DIFF environment variable is empty. Cannot summarize an empty diff.")
    # Exit gracefully, or handle as an error if you always expect a diff
    exit(0) # Exit with success if no diff to summarize

# Safely convert PR number to integer after validation
try:
    pr_number = int(pr_number_str)
except (ValueError, TypeError):
    print(f"Error: PR_NUMBER '{pr_number_str}' is not a valid integer.")
    exit(1)

# Configure Gemini API
try:
    configure(api_key=gemini_api_key)
    # Choose a Gemini model.
    # gemini-1.5-flash is generally faster and cheaper for summarization tasks.
    # gemini-1.5-pro offers higher reasoning capabilities for more complex analyses.
    gemini_model = GenerativeModel("gemini-1.5-flash") 
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    # Cannot proceed without a working Gemini client
    exit(1)

# Initialize GitHub client
try:
    g = Github(github_token)
    repo = g.get_repo(repository_name)
    pull = repo.get_pull(pr_number)
except Exception as e:
    print(f"Error initializing GitHub client or getting PR: {e}")
    exit(1)


# --- Prompt Engineering for Gemini ---
# Craft a clear and concise prompt to guide Gemini
# The more specific you are, the better the results will be.
prompt_template = """
You are an expert Home Assistant (HA) HACS integration developer.
Your task is to summarize the following code changes from a GitHub Pull Request.

Focus on:
- What new features are introduced?
- What bugs are fixed?
- Are there any breaking changes?
- What are the key changes in Home Assistant entities, services, or configuration?
- What dependencies are added or removed (if visible in diff)?
- Any significant refactoring or performance improvements.

Provide the summary in a concise, clear, and actionable bullet-point format.
If there are no significant changes to report based on the diff, state that explicitly.
Start the summary with "## 🤖 AI-Generated Summary"

Here are the code changes (git diff format):
```diff
{diff_content}
"""

full_prompt = prompt_template.format(diff_content=pr_diff)

--- Interact with Gemini API ---
ai_summary = "🤖 AI Assistant: Failed to generate summary." # Default error message
try:
print("Sending diff to Gemini for summarization...")
# Using generate_content for a single turn conversation
response = gemini_model.generate_content(full_prompt)

# Access the text from the response
if response and response.text:
    ai_summary = response.text.strip()
    print("Gemini response received.")
    print("-" * 20)
    print(ai_summary)
    print("-" * 20)
else:
    ai_summary = "🤖 AI Assistant: Gemini returned an empty or invalid response."
    print(ai_summary)
except Exception as e:
print(f"Error during Gemini API call: {e}")
ai_summary = f"🤖 AI Assistant: Failed to generate summary due to an API error: {e}"

--- Update Pull Request on GitHub ---
try:
current_pr_body = pull.body if pull.body else ""

# Define markers to control where the AI summary is inserted/updated
    summary_start_marker = "<!-- AI_SUMMARY_START -->"
    summary_end_marker = "<!-- AI_SUMMARY_END -->"

if summary_start_marker in current_pr_body and summary_end_marker in current_pr_body:
    # If markers exist, replace the content between them
    start_index = current_pr_body.find(summary_start_marker) + len(summary_start_marker)
    end_index = current_pr_body.find(summary_end_marker)
    
    # Construct the new body with updated summary
    new_body = (
        current_pr_body[:start_index]
        + f"\n{ai_summary}\n"
        + current_pr_body[end_index:]
    )
else:
    # If no markers, append the new summary (with markers) to the existing body
    new_body = (
        f"{current_pr_body}\n\n"
        f"{summary_start_marker}\n"
        f"{ai_summary}\n"
        f"{summary_end_marker}"
    )

pull.edit(body=new_body)
print(f"Successfully updated PR #{pr_number} description.")
except Exception as e:
print(f"Error updating PR description: {e}")
# If updating the PR body fails, try to add a comment instead for visibility
try:
error_comment = f"🤖 AI Assistant: Could not update the PR description. Error: {e}\n\nGenerated Summary Attempt:\n{ai_summary}"
pull.create_issue_comment(error_comment)
print("Posted error comment to PR.")
except Exception as comment_e:
print(f"Failed to post error comment to PR: {comment_e}")