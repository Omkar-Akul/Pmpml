document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const currentBalanceEl = document.getElementById('current-balance');
    const addMoneyInput = document.getElementById('add-money-input');
    const addMoneyBtn = document.getElementById('add-money-btn');
    const authMessage = document.getElementById('auth-message');
    const walletContent = document.querySelector('.wallet-content');

    let currentUser = null;
    let userWalletBalance = 0;
    let walletUnsubscribe = null;

    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            walletContent.style.display = 'block';
            authMessage.style.display = 'none';
            setupWalletListener(user.uid);
        } else {
            currentUser = null;
            walletContent.style.display = 'none';
            authMessage.style.display = 'block';
            currentBalanceEl.textContent = '₹--';
            if (walletUnsubscribe) {
                walletUnsubscribe();
                walletUnsubscribe = null;
            }
        }
    });

    function setupWalletListener(userId) {
        const userDocRef = db.collection('users').doc(userId);

        walletUnsubscribe = userDocRef.onSnapshot(doc => {
            if (doc.exists) {
                userWalletBalance = doc.data().walletBalance || 0;
            } else {
                userWalletBalance = 100;
                userDocRef.set({
                    displayName: currentUser.displayName,
                    email: currentUser.email,
                    walletBalance: userWalletBalance
                });
            }
            updateWalletDisplay();
        }, err => {
            console.error("Error listening to wallet changes:", err);
            currentBalanceEl.textContent = 'Error';
        });
    }

    function updateWalletDisplay() {
        currentBalanceEl.textContent = `₹${userWalletBalance.toFixed(2)}`;
    }

    addMoneyBtn.addEventListener('click', () => {
        if (!currentUser) {
            alert("Please log in to add money.");
            return;
        }
        const amountToAdd = parseFloat(addMoneyInput.value);
        if (isNaN(amountToAdd) || amountToAdd <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        const userDocRef = db.collection('users').doc(currentUser.uid);
        const btnText = addMoneyBtn.querySelector('span');
        const originalText = btnText.textContent;
        addMoneyBtn.disabled = true;
        btnText.textContent = 'Adding...';

        db.runTransaction(transaction => {
            return transaction.get(userDocRef).then(doc => {
                const newBalance = (doc.data().walletBalance || 0) + amountToAdd;
                transaction.update(userDocRef, { walletBalance: newBalance });
            });
        }).then(() => {
            console.log('Transaction successful.');
            addMoneyInput.value = '100';
        }).catch(error => {
            console.error("Transaction failed: ", error);
            alert("Failed to add money. Please try again.");
        }).finally(() => {
            addMoneyBtn.disabled = false;
            btnText.textContent = originalText;
        });
    });
});
