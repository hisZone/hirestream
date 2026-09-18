<?php

namespace Database\Seeders;

use App\Enums\ExperienceLevel;
use App\Enums\JobStatus;
use App\Enums\JobType;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Employer;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class JobPostSeeder extends Seeder
{
    public function run(): void
    {
        // Categories
        $categories = [
            ['name' => 'Software Engineering', 'slug' => 'software-engineering', 'icon' => '💻'],
            ['name' => 'Design & Creative',    'slug' => 'design-creative',       'icon' => '🎨'],
            ['name' => 'Marketing',             'slug' => 'marketing',             'icon' => '📈'],
            ['name' => 'Finance & Banking',     'slug' => 'finance-banking',       'icon' => '🏦'],
            ['name' => 'Customer Service',      'slug' => 'customer-service',      'icon' => '🎧'],
        ];

        $createdCategories = [];
        foreach ($categories as $cat) {
            $createdCategories[$cat['slug']] = Category::updateOrCreate(
                ['slug' => $cat['slug']],
                ['name' => $cat['name'], 'icon' => $cat['icon'], 'is_active' => true, 'display_order' => 0]
            );
        }

        // Employer user (reuse from EmployeeSeeder or create fresh)
        $employerUser = User::updateOrCreate(
            ['email' => 'employer@example.com'],
            [
                'name' => 'Employer User',
                'username' => 'employer',
                'password' => Hash::make('password123'),
                'role' => UserRole::EMPLOYER,
                'email_verified_at' => now(),
            ]
        );

        $employer = Employer::updateOrCreate(
            ['user_id' => $employerUser->id],
            [
                'company_name' => 'Ethiopian Airlines',
                'description' => 'Ethiopia\'s flag carrier and largest airline in Africa.',
                'website' => 'https://www.ethiopianairlines.com',
                'location' => 'Addis Ababa, Ethiopia',
                'approval_status' => 'approved',
            ]
        );

        // Second employer for variety
        $employer2User = User::updateOrCreate(
            ['email' => 'employer2@example.com'],
            [
                'name' => 'Dashen Bank HR',
                'username' => 'dashenbank',
                'password' => Hash::make('password123'),
                'role' => UserRole::EMPLOYER,
                'email_verified_at' => now(),
            ]
        );

        $employer2 = Employer::updateOrCreate(
            ['user_id' => $employer2User->id],
            [
                'company_name' => 'Dashen Bank',
                'description' => 'One of Ethiopia\'s leading private commercial banks.',
                'website' => 'https://www.dashenbank.com',
                'location' => 'Addis Ababa, Ethiopia',
                'approval_status' => 'approved',
            ]
        );

        $jobs = [
            [
                'employer' => $employer,
                'category' => $createdCategories['software-engineering'],
                'title' => 'Senior React Developer',
                'description' => 'We are looking for an experienced React Developer to join our digital transformation team. You will build and maintain high-performance web applications used by millions of passengers worldwide.',
                'requirements' => ['5+ years React experience', 'TypeScript proficiency', 'REST API integration', 'Git workflow'],
                'responsibilities' => ['Build new frontend features', 'Code review and mentoring', 'Collaborate with UX team', 'Write unit tests'],
                'job_type' => JobType::FULL_TIME,
                'experience_level' => ExperienceLevel::SENIOR,
                'location' => 'Addis Ababa, Ethiopia',
                'salary_min' => 45000,
                'salary_max' => 65000,
                'salary_currency' => 'ETB',
                'is_remote' => false,
            ],
            [
                'employer' => $employer,
                'category' => $createdCategories['software-engineering'],
                'title' => 'Backend Developer (Laravel)',
                'description' => 'Join our engineering team to build robust APIs and microservices powering our booking and loyalty platforms.',
                'requirements' => ['3+ years PHP/Laravel', 'MySQL & Redis', 'RESTful API design', 'Docker basics'],
                'responsibilities' => ['Design and build APIs', 'Database optimization', 'Write feature tests', 'Participate in sprint planning'],
                'job_type' => JobType::FULL_TIME,
                'experience_level' => ExperienceLevel::MID,
                'location' => 'Addis Ababa, Ethiopia',
                'salary_min' => 38000,
                'salary_max' => 52000,
                'salary_currency' => 'ETB',
                'is_remote' => false,
            ],
            [
                'employer' => $employer,
                'category' => $createdCategories['design-creative'],
                'title' => 'UI/UX Designer',
                'description' => 'Design intuitive digital experiences for our mobile app and web platforms. Work closely with product and engineering teams.',
                'requirements' => ['Figma expertise', '3+ years UX design', 'User research skills', 'Design system experience'],
                'responsibilities' => ['Create wireframes and prototypes', 'Conduct user research', 'Maintain design system', 'Collaborate with developers'],
                'job_type' => JobType::FULL_TIME,
                'experience_level' => ExperienceLevel::MID,
                'location' => 'Addis Ababa, Ethiopia',
                'salary_min' => 30000,
                'salary_max' => 45000,
                'salary_currency' => 'ETB',
                'is_remote' => false,
            ],
            [
                'employer' => $employer,
                'category' => $createdCategories['software-engineering'],
                'title' => 'Mobile Developer (React Native)',
                'description' => 'Build and improve our passenger mobile app used by over 2 million users. Work on iOS and Android simultaneously.',
                'requirements' => ['React Native 2+ years', 'iOS & Android deployment', 'REST API integration', 'Performance optimization'],
                'responsibilities' => ['Develop new app features', 'Fix bugs and crashes', 'App store releases', 'Performance profiling'],
                'job_type' => JobType::FULL_TIME,
                'experience_level' => ExperienceLevel::MID,
                'location' => 'Addis Ababa, Ethiopia',
                'salary_min' => 40000,
                'salary_max' => 58000,
                'salary_currency' => 'ETB',
                'is_remote' => true,
            ],
            [
                'employer' => $employer,
                'category' => $createdCategories['marketing'],
                'title' => 'Digital Marketing Specialist',
                'description' => 'Drive our digital marketing campaigns across social media, email, and paid channels to grow brand awareness and ticket sales.',
                'requirements' => ['3+ years digital marketing', 'Google Ads & Meta Ads', 'Analytics tools', 'Content creation'],
                'responsibilities' => ['Manage ad campaigns', 'Track KPIs and report', 'Create marketing content', 'SEO optimization'],
                'job_type' => JobType::FULL_TIME,
                'experience_level' => ExperienceLevel::MID,
                'location' => 'Addis Ababa, Ethiopia',
                'salary_min' => 25000,
                'salary_max' => 38000,
                'salary_currency' => 'ETB',
                'is_remote' => false,
            ],
            [
                'employer' => $employer2,
                'category' => $createdCategories['finance-banking'],
                'title' => 'Software Engineer – Core Banking',
                'description' => 'Develop and maintain our core banking system integrations. Work with fintech APIs and ensure high availability of banking services.',
                'requirements' => ['Java or C# experience', 'Banking domain knowledge', 'SQL Server', 'System integration'],
                'responsibilities' => ['Maintain core banking modules', 'Integrate third-party APIs', 'Write technical documentation', 'On-call support rotation'],
                'job_type' => JobType::FULL_TIME,
                'experience_level' => ExperienceLevel::SENIOR,
                'location' => 'Addis Ababa, Ethiopia',
                'salary_min' => 50000,
                'salary_max' => 70000,
                'salary_currency' => 'ETB',
                'is_remote' => false,
            ],
            [
                'employer' => $employer2,
                'category' => $createdCategories['finance-banking'],
                'title' => 'Data Analyst',
                'description' => 'Analyze customer and transaction data to generate insights that drive business decisions across retail and corporate banking.',
                'requirements' => ['SQL proficiency', 'Python or R', 'Power BI or Tableau', 'Statistics background'],
                'responsibilities' => ['Build dashboards and reports', 'Data cleaning and modeling', 'Present findings to management', 'Support data-driven decisions'],
                'job_type' => JobType::FULL_TIME,
                'experience_level' => ExperienceLevel::MID,
                'location' => 'Addis Ababa, Ethiopia',
                'salary_min' => 32000,
                'salary_max' => 48000,
                'salary_currency' => 'ETB',
                'is_remote' => false,
            ],
            [
                'employer' => $employer2,
                'category' => $createdCategories['customer-service'],
                'title' => 'Customer Support Representative',
                'description' => 'Provide excellent support to our retail banking customers via phone, chat, and in-branch. Handle inquiries, complaints, and account issues.',
                'requirements' => ['Excellent communication', 'Banking product knowledge', 'Amharic & English fluency', 'CRM experience'],
                'responsibilities' => ['Handle customer inquiries', 'Resolve complaints', 'Process account requests', 'Escalate complex issues'],
                'job_type' => JobType::FULL_TIME,
                'experience_level' => ExperienceLevel::ENTRY,
                'location' => 'Addis Ababa, Ethiopia',
                'salary_min' => 18000,
                'salary_max' => 25000,
                'salary_currency' => 'ETB',
                'is_remote' => false,
            ],
            [
                'employer' => $employer,
                'category' => $createdCategories['software-engineering'],
                'title' => 'DevOps Engineer',
                'description' => 'Own our CI/CD pipelines, cloud infrastructure, and monitoring stack. Help engineering teams ship faster and more reliably.',
                'requirements' => ['AWS or Azure experience', 'Docker & Kubernetes', 'CI/CD pipelines', 'Linux administration'],
                'responsibilities' => ['Manage cloud infrastructure', 'Build deployment pipelines', 'Monitor system health', 'Incident response'],
                'job_type' => JobType::FULL_TIME,
                'experience_level' => ExperienceLevel::SENIOR,
                'location' => 'Addis Ababa, Ethiopia',
                'salary_min' => 55000,
                'salary_max' => 75000,
                'salary_currency' => 'ETB',
                'is_remote' => true,
            ],
            [
                'employer' => $employer2,
                'category' => $createdCategories['software-engineering'],
                'title' => 'Frontend Developer Intern',
                'description' => 'A 6-month paid internship for fresh graduates to gain hands-on experience building real banking web interfaces.',
                'requirements' => ['HTML, CSS, JavaScript basics', 'React fundamentals', 'Eagerness to learn', 'Computer Science degree or equivalent'],
                'responsibilities' => ['Assist senior developers', 'Build UI components', 'Write documentation', 'Participate in code reviews'],
                'job_type' => JobType::INTERNSHIP,
                'experience_level' => ExperienceLevel::ENTRY,
                'location' => 'Addis Ababa, Ethiopia',
                'salary_min' => 8000,
                'salary_max' => 12000,
                'salary_currency' => 'ETB',
                'is_remote' => false,
            ],
        ];

        foreach ($jobs as $jobData) {
            $employer = $jobData['employer'];
            $category = $jobData['category'];
            $title = $jobData['title'];
            $slug = Str::slug($title) . '-' . Str::lower(Str::random(6));

            // Skip if a job with same title + employer already exists
            $exists = JobPost::where('employer_id', $employer->id)
                ->where('title', $title)
                ->exists();

            if ($exists) {
                continue;
            }

            JobPost::create([
                'employer_id' => $employer->id,
                'category_id' => $category->id,
                'title' => $title,
                'slug' => $slug,
                'description' => $jobData['description'],
                'requirements' => $jobData['requirements'],
                'responsibilities' => $jobData['responsibilities'],
                'job_type' => $jobData['job_type'],
                'experience_level' => $jobData['experience_level'],
                'location' => $jobData['location'],
                'salary_min' => $jobData['salary_min'],
                'salary_max' => $jobData['salary_max'],
                'salary_currency' => $jobData['salary_currency'],
                'is_remote' => $jobData['is_remote'],
                'status' => JobStatus::PUBLISHED,
                'published_at' => now(),
                'expires_at' => now()->addDays(30),
                'views_count' => 0,
            ]);
        }
    }
}
