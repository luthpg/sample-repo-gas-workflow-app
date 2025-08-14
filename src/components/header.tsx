import { ApprovalForm } from '@/components/approval-form';
import { UserAvatar } from '@/components/user-avatar';
import { parameters } from '@/lib/parameters';

export function Header() {
  const currentUserEmail = parameters.userAddress;

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) pb-2 mb-6">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <h1 className="text-xl font-bold">稟議App</h1>
        <div className="ml-auto">
          <ApprovalForm />
        </div>
        <UserAvatar
          user={{
            name:
              currentUserEmail?.slice(0, currentUserEmail.indexOf('@')) || '',
            email: currentUserEmail || '',
          }}
        />
      </div>
    </header>
  );
}
