async function getRepositories() {
    const username = $('#username').val();
    if (!username) {
        alert('Please enter a GitHub username.');
        return;
    }

    // Hide search container and show user profile section
    $('#search-container').hide();
    $('#user-profile').show(); 
    $('#loader').show();
    $('#repositories').empty();
    $('#pagination ul').empty();

    // GitHub API URL for user repositories
    const apiUrl = `https://api.github.com/users/${username}/repos`;

    // Fetch user repositories using Fetch API
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const profileData = await fetch(`https://api.github.com/users/${username}`);
        const userProfile = await profileData.json();
        displayUserProfile(userProfile);
        displayRepositories(data);
    } catch (error) {
        alert('Error fetching repositories. Please try again.');
    } finally {
        $('#loader').hide();
    }
}

function displayUserProfile(userProfile) {
    const $profileImage = $('#profile-image');
    const $userName = $('#user-name');
    const $bio = $('#bio');

    $profileImage.attr('src', userProfile.avatar_url || 'default-image-url.jpg'); // Add a default image URL
    $userName.text(userProfile.login || 'Username not available');
    $bio.text(userProfile.bio || '');
}

async function displayRepositories(repositories) {
    const $repositoriesContainer = $('#repositories');
    const $paginationContainer = $('#pagination ul');

    if (repositories.length === 0) {
        $repositoriesContainer.html('<p>No repositories found.</p>');
        return;
    }

    const itemsPerPage = 10;
    const totalPages = Math.ceil(repositories.length / itemsPerPage);
    let currentPage = 1;

    displayPage(currentPage);

    async function displayPage(page) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageRepositories = repositories.slice(startIndex, endIndex);

        $repositoriesContainer.empty();

        const $row = $('<div class="row"></div>');

        for (let i = 0; i < pageRepositories.length; i += 2) {
            const repo1 = pageRepositories[i];
            const repo2 = pageRepositories[i + 1];

            const $col1 = $('<div class="col-md-6"></div>');
            const $col2 = $('<div class="col-md-6"></div>');

            if (repo1) {
                const commitsCount1 = await getCommitsCount(repo1.commits_url);
                const $box1 = $(`
                    <div class="repository-box">
                        <h5>${repo1.name}</h5>
                        <p>Commits: ${commitsCount1}</p>
                    </div>
                `);
                $col1.append($box1);
            }

            if (repo2) {
                const commitsCount2 = await getCommitsCount(repo2.commits_url);
                const $box2 = $(`
                    <div class="repository-box">
                        <h5>${repo2.name}</h5>
                        <p>Commits: ${commitsCount2}</p>
                    </div>
                `);
                $col2.append($box2);
            }

            $row.append($col1, $col2);
        }

        $repositoriesContainer.append($row);
        displayPagination(page);
    }

    function displayPagination(currentPage) {
        $paginationContainer.empty();

        for (let i = 1; i <= totalPages; i++) {
            const $pageItem = $(`<li class="page-item"><span class="page-link">${i}</span></li>`);
            $pageItem.click(() => {
                displayPage(i);
            });

            if (i === currentPage) {
                $pageItem.addClass('active');
            }

            $paginationContainer.append($pageItem);
        }
    }

    async function getCommitsCount(commitsUrl) {
        // Fetch commits for the repository and return the count
        const commitsApiUrl = commitsUrl.replace('{/sha}', '');
        try {
            const response = await fetch(commitsApiUrl);
            const commits = await response.json();
            return commits.length;
        } catch (error) {
            console.error('Error fetching commits.');
            return 0;
        }
    }
}